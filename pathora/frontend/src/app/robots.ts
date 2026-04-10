import { Metadata, MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/dashboard", "/private", "api"]
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/admin", "/dashboard", "/private", "api"]
            }
        ]
    }
}