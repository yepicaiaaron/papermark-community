import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Language visitors see on the access screen and in the viewer. */
export function VisitorLanguageCard({
  defaultLanguage,
  onDefaultLanguageChange,
  hasAccess = true,
}: {
  defaultLanguage: string;
  onDefaultLanguageChange: (code: any) => void;
  hasAccess?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Visitor language</Label>
      <Select
        value={defaultLanguage}
        onValueChange={onDefaultLanguageChange}
        disabled={!hasAccess}
      >
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
