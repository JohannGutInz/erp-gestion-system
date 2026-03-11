import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function Combobox({ items, value, onChange, placeholder, noResultsText }) {
  const [open, setOpen] = useState(false);

  // Find the selected item matching the current value (ID)
  // Ensure we compare values, not labels, for selection state
  const selectedItem = items.find(
    (item) => item.value === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-gray-900 hover:bg-gray-800 text-white border-gray-700"
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-gray-700">
        <Command className="bg-gray-900 text-white border-gray-700">
          <CommandInput placeholder={placeholder} className="text-white placeholder:text-gray-400" />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-gray-400">{noResultsText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Set value to label for search functionality
                  onSelect={(currentValue) => {
                    // currentValue is the lowercase label from the command item
                    // Find the original item by matching labels case-insensitively
                    const selected = items.find(
                      (i) => i.label.toLowerCase() === currentValue.toLowerCase()
                    );
                    // Pass the item's value (ID) to the parent, NOT the label
                    onChange(selected ? selected.value : '');
                    setOpen(false);
                  }}
                  className="data-[selected=true]:bg-gray-800 data-[selected=true]:text-white hover:bg-gray-800 cursor-pointer text-gray-200 aria-selected:bg-gray-800 aria-selected:text-white"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}