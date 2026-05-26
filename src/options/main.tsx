import "../shared/styles.css";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SETTINGS } from "@/shared/settings";
import type { BackgroundToContentMessage, ExtensionSettings } from "@/shared/types";

function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [excludedDomainsText, setExcludedDomainsText] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: "settings/get" }).then((response: BackgroundToContentMessage) => {
      if (response.type === "settings/response") {
        setSettings(response.payload);
        setExcludedDomainsText(response.payload.excludedDomains.join("\n"));
      }
    });
  }, []);

  const excludedDomains = useMemo(
    () => excludedDomainsText.split("\n").map((domain) => domain.trim()).filter(Boolean),
    [excludedDomainsText]
  );

  async function save(next: ExtensionSettings) {
    const response = (await chrome.runtime.sendMessage({ type: "settings/update", payload: next })) as BackgroundToContentMessage;
    if (response.type === "settings/response") {
      setSettings(response.payload);
      setExcludedDomainsText(response.payload.excludedDomains.join("\n"));
      setSavedAt(new Date().toLocaleTimeString());
    }
  }

  const pendingSettings: ExtensionSettings = {
    ...settings,
    excludedDomains
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.5),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Sparky Autocomplete</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Extension settings</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Configure the Chrome MV3 scaffold for local-first inline autocomplete. Your typed context is routed to the extension background worker and then to your configured localhost endpoint.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Autocomplete behavior</CardTitle>
            <CardDescription>Control when suggestions run and how they are accepted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="enabled">Enable autocomplete</Label>
                <p className="text-sm text-muted-foreground">When off, the content script stays idle.</p>
              </div>
              <Switch
                id="enabled"
                checked={pendingSettings.enabled}
                onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="debounce">Trigger delay in ms</Label>
                <Input
                  id="debounce"
                  type="number"
                  min={100}
                  step={50}
                  value={pendingSettings.debounceMs}
                  onChange={(event) => setSettings({ ...settings, debounceMs: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortcut">Accept shortcut</Label>
                <Input id="shortcut" value="Tab" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local model endpoint</CardTitle>
            <CardDescription>Defaults to an Ollama-compatible generate endpoint. The adapter also accepts response, completion, or text fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={pendingSettings.endpointUrl}
                onChange={(event) => setSettings({ ...settings, endpointUrl: event.target.value })}
                placeholder="http://localhost:11434/api/generate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model name</Label>
              <Input
                id="model"
                value={pendingSettings.modelName ?? ""}
                onChange={(event) => setSettings({ ...settings, modelName: event.target.value })}
                placeholder="llama3.2, qwen2.5, mistral, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Excluded domains</CardTitle>
            <CardDescription>One domain per line. Subdomains are excluded automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={excludedDomainsText}
              onChange={(event) => setExcludedDomainsText(event.target.value)}
              placeholder={"bank.example\nwork.internal"}
            />
            <p className="text-sm text-muted-foreground">Privacy default: suggestions are only sent to your configured local HTTP endpoint.</p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={() => void save(pendingSettings)}>Save settings</Button>
          {savedAt ? <p className="text-sm text-muted-foreground">Saved at {savedAt}</p> : null}
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
