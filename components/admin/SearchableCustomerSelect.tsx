'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface SearchableCustomerSelectProps {
    customers: Customer[];
    value: number | null;
    onChange: (customerId: number | null) => void;
    placeholder?: string;
    className?: string;
}

export function SearchableCustomerSelect({
    customers,
    value,
    onChange,
    placeholder = "Select customer...",
    className
}: SearchableCustomerSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedCustomer = customers.find(c => c.id === value);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className={cn("relative w-full", className)}>
            {/* Trigger Button/Input */}
            <div
                className="relative w-full h-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setOpen(!open)}
            >
                {selectedCustomer ? (
                    <div className="flex items-center gap-2 h-full px-3">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {selectedCustomer.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{selectedCustomer.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{selectedCustomer.email}</span>
                        </div>
                        {value && (
                            <button
                                className="ml-auto p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(null);
                                }}
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between h-full px-3">
                        <span className="text-sm text-muted-foreground">{placeholder}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Search Input */}
                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-9"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {/* No Customer Option */}
                        <div
                            className={cn(
                                "px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800",
                                value === null && "bg-zinc-100 dark:bg-zinc-800"
                            )}
                            onClick={() => {
                                onChange(null);
                                setOpen(false);
                                setSearchQuery("");
                            }}
                        >
                            <span className="text-sm text-muted-foreground italic">No Customer Linked</span>
                        </div>

                        {/* Customer Options */}
                        {filteredCustomers.length === 0 ? (
                            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                                No customers found
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className={cn(
                                        "px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2 transition-colors border-b last:border-b-0 border-zinc-100 dark:border-zinc-800",
                                        value === customer.id && "bg-zinc-100 dark:bg-zinc-800"
                                    )}
                                    onClick={() => {
                                        onChange(customer.id);
                                        setOpen(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {customer.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{customer.name}</span>
                                        <span className="text-xs text-muted-foreground truncate">{customer.email}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
