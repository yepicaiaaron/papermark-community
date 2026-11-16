import type { Brand } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Id used for a brand that is being created but not yet saved. */
export const DRAFT_TEAM_BRAND_ID = "__draft_brand__";

export function nextTeamBrandName(brands: Pick<Brand, "name">[]): string {
  const taken = new Set(brands.map((b) => b.name.toLowerCase()));
  if (!taken.has("default")) return "Default";
  for (let i = 2; ; i++) {
    const name = `Brand ${i}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
}

export function TeamBrandSwitcher({
  brands,
  selectedBrandId,
  defaultBrandId,
  brandName,
  onBrandNameChange,
  onSelect,
  onCreate,
  onSetDefault,
  onDelete,
  disabled,
}: {
  brands: Pick<Brand, "id" | "name">[];
  selectedBrandId: string | null;
  defaultBrandId: string | null;
  brandName: string;
  onBrandNameChange: (name: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const isDraft = selectedBrandId === DRAFT_TEAM_BRAND_ID;
  const isDefault = !!selectedBrandId && selectedBrandId === defaultBrandId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={selectedBrandId ?? undefined}
        onValueChange={onSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a brand" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
              {brand.id === defaultBrandId ? " (default)" : ""}
            </SelectItem>
          ))}
          {isDraft ? (
            <SelectItem value={DRAFT_TEAM_BRAND_ID}>New brand</SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      <Input
        className="w-48"
        value={brandName}
        onChange={(e) => onBrandNameChange(e.target.value)}
        placeholder="Brand name"
        disabled={disabled}
        aria-label="Brand name"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCreate}
        disabled={disabled}
      >
        New brand
      </Button>
      {!isDraft && !isDefault && selectedBrandId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSetDefault}
          disabled={disabled}
        >
          Make default
        </Button>
      ) : null}
      {!isDraft && selectedBrandId ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete
        </Button>
      ) : null}
    </div>
  );
}
