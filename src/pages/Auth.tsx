import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { highestStaffRole, interpretSignup, signInErrorMessage } from "@/lib/staffAuth";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [tab, setTab] = useState("signin");
  const [notice, setNotice] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stateNotice = (location.state as { notice?: string } | null)?.notice;
    if (stateNotice) setNotice(stateNotice);
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    const routeExistingSession = async () => {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const params = new URLSearchParams(hash);
      const description = params.get("error_description");
      if (description) {
        toast.error(description.replace(/\+/g, " "));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      if (cancelled || !session) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (cancelled) return;
      if (error) {
        toast.error("Could not verify staff access. Try signing in again.");
        return;
      }

      if (highestStaffRole((data || []).map((row) => row.role))) {
        navigate("/admin", { replace: true });
        return;
      }

      // A confirmed signup still has no staff role. Drop the session so /auth
      // does not bounce them through /admin and back.
      await supabase.auth.signOut();
      if (!cancelled) {
        setNotice("Your email is confirmed, but an admin still needs to approve this account before the dashboard will open.");
        setTab("signin");
      }
    };

    routeExistingSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Confirmation does not grant a role. Land on this page, which
          // explains the approval step, instead of the protected dashboard.
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      const outcome = interpretSignup({
        error: error ? { message: error.message } : null,
        user: data.user,
        session: data.session,
      });

      if (outcome.kind === "error") {
        toast.error(outcome.message);
        return;
      }

      if (outcome.kind === "pending_approval") {
        await supabase.auth.signOut();
      }

      if (outcome.kind === "already_registered") {
        toast.error(outcome.message);
        setTab("signin");
      } else {
        toast.success(outcome.message);
        setEmail("");
        setPassword("");
        setTab("signin");
      }
      setNotice(outcome.message);
    } catch (error: unknown) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id ?? data.session?.user.id;
      if (!userId) throw new Error("Sign in did not return an account");

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      if (!highestStaffRole((roles || []).map((row) => row.role))) {
        await supabase.auth.signOut();
        setNotice("Signed in, but this account has no staff role yet. Ask an admin to approve it from the Team tab, then sign in again.");
        return;
      }

      toast.success("Logged in successfully!");
      navigate("/admin");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      toast.error(signInErrorMessage(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemCount={getCartItemCount()} />
      
      <main className="flex-1 container py-6 sm:py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-[95vw] sm:max-w-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-primary">Admin Access</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Staff sign in. New accounts stay closed until an admin approves them.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {notice && (
              <p className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs sm:text-sm text-foreground">
                {notice}
              </p>
            )}
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-sm">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10 sm:h-11" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-center text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10 sm:h-11" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                    Creating an account only sends a request. Confirm the email if one arrives, then wait for an admin to approve you before signing in.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg">Reset Password</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Enter your email and we'll send you a reset link.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleForgotPassword}
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Link"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;