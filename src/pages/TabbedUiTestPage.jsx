import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Heart, Home, Library, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'read', label: 'Read', icon: BookOpen },
  { value: 'gospel', label: 'Gospel', icon: Heart },
  { value: 'resources', label: 'Resources', icon: Library },
];

function ActionLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function Panel({ eyebrow, title, description, children }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function TabbedUiTestPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-serif text-xl font-bold leading-tight">KJB Reader</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Extension-style tabs prototype</p>
          </div>
          <span className="rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            Test UI
          </span>
        </div>
      </header>

      <Tabs defaultValue="home" className="w-full">
        <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <TabsList
            aria-label="KJB Reader prototype sections"
            className="mx-auto flex h-auto w-full max-w-3xl items-stretch justify-start overflow-x-auto rounded-none bg-transparent p-0 text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="min-w-[5.5rem] flex-1 gap-1.5 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-3 py-3 text-xs font-semibold tracking-[0.025em] shadow-none transition-colors hover:text-foreground focus-visible:z-10 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="home" className="m-0 focus-visible:ring-inset">
          <Panel
            eyebrow="Home"
            title="A calmer way to move through KJB Reader"
            description="This experiment uses the extension’s compact tab strip as the primary navigation pattern. Each section changes in place without a page transition."
          >
            <div className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Verse example</p>
              <blockquote className="mt-3 font-serif text-lg font-semibold leading-8 sm:text-xl">
                “For God so loved the world, that he gave his only begotten Son…”
              </blockquote>
              <p className="mt-3 text-sm font-semibold text-primary">John 3:16</p>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="read" className="m-0 focus-visible:ring-inset">
          <Panel
            eyebrow="Read"
            title="The Gospel According to St. John"
            description="Reader controls can sit directly beneath the active tab, matching the extension’s fixed tabs-and-controls layout."
          >
            <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between border-b pb-3 text-sm">
                <span className="font-semibold">Chapter 3</span>
                <span className="text-muted-foreground">Verse 16</span>
              </div>
              <p className="font-serif text-lg leading-8">
                <sup className="mr-1 text-xs font-bold text-primary">16</sup>
                For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.
              </p>
              <ActionLink to="/read">Open full reader</ActionLink>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="gospel" className="m-0 focus-visible:ring-inset">
          <Panel
            eyebrow="Gospel"
            title="How to be saved"
            description="A focused tab keeps the gospel presentation one touch away while preserving the reading context."
          >
            <div className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
              <p className="font-serif text-lg font-semibold leading-8">
                Christ died for our sins, was buried, and rose again the third day according to the scriptures.
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">1 Corinthians 15:1–4</p>
              <div className="mt-5">
                <ActionLink to="/gospel">Read the gospel</ActionLink>
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="resources" className="m-0 focus-visible:ring-inset">
          <Panel
            eyebrow="Resources"
            title="Study and sharing resources"
            description="The same tab pattern scales to link collections without adding another navigation drawer or bottom bar."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/resources" className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50">
                <Library className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">KJB resources</p>
                <p className="mt-1 text-sm text-muted-foreground">Study links, preaching, and ministry resources.</p>
              </Link>
              <Link to="/search" className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50">
                <Search className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">Bible search</p>
                <p className="mt-1 text-sm text-muted-foreground">Find verses and phrases throughout the scriptures.</p>
              </Link>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </main>
  );
}
