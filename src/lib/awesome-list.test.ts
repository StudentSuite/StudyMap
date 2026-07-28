import { describe, expect, it } from "vitest";

import { parseAwesomeList } from "@/lib/awesome-list";

const README = `# Awesome Student Resources

## Table of Contents

| Section | Link | Count |
|---|---|---|

## Student Discounts & Free Access

<details open>
<summary>Show resources</summary>

- **[GitHub Student Pack](https://education.github.com/pack)** - Free dev tools bundle (free).
- **[Notion Education](https://notion.so/students)** - Free personal plan for students (free).

</details>

## Scholarships & Financial Aid

<details open>
<summary>Show resources</summary>

- **[Fastweb](https://fastweb.com)** - Scholarship search engine (free).

</details>

## Contributing

See CONTRIBUTING.md.

## License

MIT
`;

describe("parseAwesomeList", () => {
  it("groups entries under their nearest heading", () => {
    const sections = parseAwesomeList(README);

    expect(sections.map((s) => s.title)).toEqual([
      "Student Discounts & Free Access",
      "Scholarships & Financial Aid",
    ]);
    expect(sections[0].entries).toHaveLength(2);
    expect(sections[0].entries[0]).toEqual({
      name: "GitHub Student Pack",
      url: "https://education.github.com/pack",
      description: "Free dev tools bundle (free).",
    });
  });

  it("drops sections with no matching entry bullets", () => {
    const sections = parseAwesomeList(README);
    const titles = sections.map((s) => s.title);

    expect(titles).not.toContain("Table of Contents");
    expect(titles).not.toContain("Contributing");
    expect(titles).not.toContain("License");
  });

  it("returns an empty array for content with no ## headings", () => {
    expect(parseAwesomeList("- **[Name](url)** - desc.")).toEqual([]);
  });
});
