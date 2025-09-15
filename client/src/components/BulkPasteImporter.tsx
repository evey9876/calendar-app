import { useState } from "react";
import { parseBulkText, BulkEvent } from "../utils/bulkParse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkPasteImporterProps {
  onImport: (events: BulkEvent[]) => Promise<void>;
}

export default function BulkPasteImporter({ onImport }: BulkPasteImporterProps) {
  const [text, setText] = useState("");
  const [clip, setClip] = useState(true);
  const [preview, setPreview] = useState<BulkEvent[]>([]);

  const handlePreview = () => {
    const evts = parseBulkText(text, { clipToOperatingYear: clip });
    setPreview(evts);
  };

  const handleImport = async () => {
    const evts = parseBulkText(text, { clipToOperatingYear: clip });
    await onImport(evts); // save each to IndexedDB
    setText("");
    setPreview([]);
  };

  return (
    <div className="space-y-3">
      <Textarea
        className="w-full h-40"
        placeholder="Paste your list here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        data-testid="bulk-paste-textarea"
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={clip} 
            onCheckedChange={setClip}
            data-testid="checkbox-clip-operating-year"
          />
          <label className="text-sm">
            Clip to operating year (Aug 1, 2025 → Jul 31, 2026)
          </label>
        </div>
        <Button 
          onClick={handlePreview} 
          variant="outline"
          data-testid="button-preview-events"
        >
          Preview
        </Button>
        <Button 
          onClick={handleImport}
          data-testid="button-import-events"
        >
          Import
        </Button>
      </div>

      {preview.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="font-semibold mb-2">
            Preview ({preview.length} events)
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {preview.map((e, i) => (
              <li key={i}>
                <span className="text-gray-600">{e.date}</span> — 
                <span className="font-medium text-blue-600">
                  {e.type.replace("_", " ")}
                </span>: 
                <span>{e.title}</span>
                {e.startDate && e.endDate && e.startDate !== e.endDate && (
                  <span className="text-gray-500 ml-2">
                    (Multi-day: {e.startDate} to {e.endDate})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}