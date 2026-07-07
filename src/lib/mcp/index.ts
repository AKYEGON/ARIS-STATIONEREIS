import { defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listDeals from "./tools/list-deals";
import listTestimonials from "./tools/list-testimonials";

export default defineMcp({
  name: "aris-stationeries-mcp",
  title: "ARIS Stationeries",
  version: "0.1.0",
  instructions:
    "Browse the ARIS Stationeries catalog: search products, look up a product by slug, list categories, view active deals (flash sales, bundles, BOGO), and read customer testimonials. All tools are read-only and reflect the live storefront at arisstationaries.co.ke.",
  tools: [searchProducts, getProduct, listCategories, listDeals, listTestimonials],
});
