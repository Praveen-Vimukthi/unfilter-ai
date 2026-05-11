import { createFileRoute } from "@tanstack/react-router";
import FilterRemover from "@/components/FilterRemover";

export const Route = createFileRoute("/")({
  component: FilterRemover,
  head: () => ({
    meta: [
      { title: "Unfilter — Remove filters from photos with AI" },
      {
        name: "description",
        content:
          "Strip filters and over-processed effects from photos. Upload an image and instantly restore a natural, true-to-life look.",
      },
      { property: "og:title", content: "Unfilter — Remove filters from photos with AI" },
      {
        property: "og:description",
        content: "Restore natural color and tone by removing filters from any photo.",
      },
    ],
  }),
});
