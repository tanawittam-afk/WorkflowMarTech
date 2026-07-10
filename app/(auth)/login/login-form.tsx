"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBookingStore } from "@/lib/store/booking-store";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginAsMarketing = useBookingStore((s) => s.loginAsMarketing);
  const loginAsCustomer = useBookingStore((s) => s.loginAsCustomer);
  const customers = useBookingStore((s) => s.customers);

  const [tab, setTab] = useState(searchParams.get("as") === "marketing" ? "marketing" : "customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.customerId ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Log in to Smart Space</CardTitle>
        <CardDescription>This is a prototype — no real credentials required.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="customer" className="flex-1">
              Customer
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1">
              Marketing Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer-select">Log in as</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.customerId} value={c.customerId}>
                      {c.name} ({c.customerId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                loginAsCustomer(selectedCustomerId);
                router.push("/book");
              }}
            >
              Log in
            </Button>
            <p className="text-center text-sm text-ink3">
              New here?{" "}
              <Link href="/register" className="text-accent-strong hover:underline">
                Register as a customer
              </Link>
            </p>
          </TabsContent>

          <TabsContent value="marketing" className="flex flex-col gap-4">
            <p className="text-sm text-ink2">
              Sign in to view the Marketing Tech Dashboard and Analytics & Statistics.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                loginAsMarketing();
                router.push("/dashboard");
              }}
            >
              Sign in as Marketing Staff
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
