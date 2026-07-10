"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookingStore } from "@/lib/store/booking-store";
import type { Customer, Occupation } from "@/lib/data/types";

export default function RegisterPage() {
  const router = useRouter();
  const registerCustomer = useBookingStore((s) => s.registerCustomer);
  const loginAsCustomer = useBookingStore((s) => s.loginAsCustomer);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Customer["gender"]>("Male");
  const [age, setAge] = useState("22");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState<Occupation>("Students");
  const [income, setIncome] = useState("8000");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const canSubmit = name && address && phoneNumber && email;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const customer = registerCustomer({
      name,
      gender,
      age: Number(age) || 18,
      address,
      occupation,
      income: Number(income) || 0,
      phoneNumber,
      email,
    });
    loginAsCustomer(customer.customerId);
    router.push("/book");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Register as a customer</CardTitle>
        <CardDescription>Simulated registration — data stays in this browser only.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Customer["gender"])}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={16} max={80} value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="e.g. Thonglor, Bangkok"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Select value={occupation} onValueChange={(v) => setOccupation(v as Occupation)}>
                <SelectTrigger id="occupation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Students">Students</SelectItem>
                  <SelectItem value="Freelancers">Freelancers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="income">Monthly income (THB)</Label>
              <Input id="income" type="number" min={0} value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              placeholder="08X-XXX-XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
