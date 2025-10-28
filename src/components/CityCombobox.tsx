import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { indianCities } from "@/lib/indianCities";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function CityCombobox({ value, onChange, placeholder = "Select city...", id }: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter cities based on search query
  const filteredCities = React.useMemo(() => {
    if (!searchQuery) return indianCities;

    const query = searchQuery.toLowerCase();
    return indianCities.filter(
      (city) =>
        city.label.toLowerCase().includes(query) ||
        city.state.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get display label for selected value
  const selectedCity = indianCities.find((city) => city.label === value);
  const displayValue = selectedCity ? selectedCity.label : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city or state..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.label}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
