import "../shared/styles.css";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SETTINGS } from "@/shared/settings";
import type { BackgroundToContentMessage, ExtensionSettings } from "@/shared/types";

function PopupApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("Loading settings...");

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: "settings/get" }).then((response: BackgroundToContentMessage) => {
      if (response.type === "settings/response") {
        setSettings(response.payload);
        setStatus(response.payload.enabled ? "Autocomplete is enabled." : "Autocomplete is paused.");
      }
    });
  }, []);

  async function updateSettings(next: Partial<ExtensionSettings>) {
    const response = (await chrome.runtime.sendMessage({ type: "settings/update", payload: next })) as BackgroundToContentMessage;
    if (response.type === "settings/response") {
      setSettings(response.payload);
      setStatus(response.payload.enabled ? "Autocomplete is enabled." : "Autocomplete is paused.");
    }
  }

  return (
    <main className="w-[360px] bg-background p-4 text-foreground">
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle>Sparky</CardTitle>
          <CardDescription className="text-primary-foreground/80">Local-first inline autocomplete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div>
              <Label htmlFor="enabled">Autocomplete</Label>
              <p className="text-xs text-muted-foreground">Suggest text while you type.</p>
            </div>
            <Switch id="enabled" checked={settings.enabled} onCheckedChange={(enabled) => void updateSettings({ enabled })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Local endpoint</Label>
            <Input
              id="endpoint"
              value={settings.endpointUrl}
              onChange={(event) => setSettings({ ...settings, endpointUrl: event.target.value })}
              onBlur={() => void updateSettings({ endpointUrl: settings.endpointUrl })}
              placeholder="http://localhost:11434/api/generate"
            />
          </div>

          <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">{status}</p>

          <Button variant="outline" className="w-full" onClick={() => chrome.runtime.openOptionsPage()}>
            Open full settings
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
);
