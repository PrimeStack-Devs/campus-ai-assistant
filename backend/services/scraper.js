import axios from "axios";
import * as cheerio from "cheerio";

export const scrapePage = async (url) => {
  try {
    console.log(`Scraping: ${url}`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Remove script and style tags
    $("script, style, noscript").remove();

    const text = $("body").text();

    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Scraping error:", error.message);
    return "";
  }
};