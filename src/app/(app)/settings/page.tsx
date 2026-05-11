import { Settings, Database, LogOut } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/queries";

export default async function SettingsPage() {
  const categories = await getCategories();
  return (
    <>
      <PageHeader title="Settings" subtitle="Account and data." icon={Settings} />

      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4" /> Expense categories
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs">
                  {c.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-fg">
              Categories are seeded from the schema. Edit them in the database if you need more.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="text-sm font-medium">Session</div>
            <p className="text-xs text-muted-fg">
              You're signed in via the single-password gate. Log out clears the cookie on this device.
            </p>
            <form action="/api/logout" method="post">
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="size-3.5" /> Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
