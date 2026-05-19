import { Card } from "#/components/ui/card";

type SectionPlaceholderProps = {
  description: string;
  title: string;
};

export function SectionPlaceholder({ description, title }: SectionPlaceholderProps) {
  return (
    <section className="grid gap-4">
      <header>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-success">
          Social Media
        </p>
        <h1 className="m-0 text-4xl font-extrabold tracking-normal">{title}</h1>
      </header>
      <Card>
        <p className="m-0 text-muted-text">{description}</p>
      </Card>
    </section>
  );
}
