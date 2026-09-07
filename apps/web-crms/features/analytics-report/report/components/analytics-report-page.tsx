"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  Users,
  Ticket,
  ShoppingCart,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Sample datasets for 7, 30, and 90 days
const TICKET_VOLUME_DATA = [
  { date: "Mon", total: 42, resolved: 38 },
  { date: "Tue", total: 55, resolved: 49 },
  { date: "Wed", total: 68, resolved: 61 },
  { date: "Thu", total: 51, resolved: 48 },
  { date: "Fri", total: 74, resolved: 68 },
  { date: "Sat", total: 30, resolved: 28 },
  { date: "Sun", total: 22, resolved: 20 },
];

const RESPONSE_TIME_DATA = [
  { date: "Mon", firstResponseMins: 18, resolutionHours: 3.8 },
  { date: "Tue", firstResponseMins: 14, resolutionHours: 3.2 },
  { date: "Wed", firstResponseMins: 12, resolutionHours: 2.9 },
  { date: "Thu", firstResponseMins: 15, resolutionHours: 3.4 },
  { date: "Fri", firstResponseMins: 10, resolutionHours: 2.5 },
  { date: "Sat", firstResponseMins: 8, resolutionHours: 1.8 },
  { date: "Sun", firstResponseMins: 9, resolutionHours: 2.0 },
];

const NEW_CUSTOMERS_DATA = [
  { date: "W1", direct: 45, ecommerce: 80 },
  { date: "W2", direct: 52, ecommerce: 95 },
  { date: "W3", direct: 61, ecommerce: 110 },
  { date: "W4", direct: 70, ecommerce: 125 },
];

const SEGMENT_SIZES_DATA = [
  { name: "Enterprise", count: 420, color: "#2563eb" },
  { name: "VIP Accounts", count: 310, color: "#7c3aed" },
  { name: "SMB Clients", count: 850, color: "#059669" },
  { name: "At-Risk", count: 95, color: "#dc2626" },
  { name: "Leads", count: 640, color: "#d97706" },
];

const ECOMMERCE_SPLIT_DATA = [
  { category: "Direct Store", sales: 45000, orders: 320 },
  { category: "Marketplace", sales: 28000, orders: 210 },
  { category: "Subscription", sales: 38000, orders: 410 },
  { category: "Wholesale", sales: 19000, orders: 85 },
];

const CAMPAIGN_PERFORMANCE_DATA = [
  { channel: "Email Broadcasts", sent: 12400, openRate: 42, clickRate: 18 },
  { channel: "Storefront Banners", sent: 45000, openRate: 68, clickRate: 24 },
  { channel: "Popups & Modals", sent: 18200, openRate: 35, clickRate: 12 },
];

export function AnalyticsReportPage() {
  const [dateRange, setDateRange] = useState<string>("30d");

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-container-max mx-auto">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-md border-b border-border">
        <div>
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Analytics &amp; Report
          </h1>
          <p className="text-body-md text-muted-foreground mt-1">
            Comprehensive overview of support metrics, revenue distribution, customer segments, and campaign outcomes.
          </p>
        </div>

        {/* Date Range Picker Controls */}
        <div className="flex items-center gap-sm">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-background font-semibold shadow-sm">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent aria-label="Select Date Range">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 6 Core Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Section 1: Ticket Volume (Time-based Chart) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Ticket Volume
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                +14.2% YoY
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Incoming customer support tickets vs. successfully resolved issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TICKET_VOLUME_DATA}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="Total Tickets" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Response Time (Time-based Chart) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Response Time
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                -22% Mins (Faster)
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Average first response latency (mins) and resolution duration (hrs).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RESPONSE_TIME_DATA}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="firstResponseMins" name="First Response (mins)" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolutionHours" name="Resolution (hrs)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: New Customers (Time-based Chart) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                New Customers
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                +18% Signups
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Customer acquisition growth split by direct vs. ecommerce channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={NEW_CUSTOMERS_DATA}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="direct" name="Direct CRM" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="ecommerce" name="Ecommerce Store" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Segment Sizes (Distribution Breakdown) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Segment Sizes
              </CardTitle>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                2,315 Total Contacts
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Distribution of customer accounts across registered target segments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={SEGMENT_SIZES_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {SEGMENT_SIZES_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Ecommerce Split (Channel & Order Revenue Breakdown) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-sky-500" />
                Ecommerce Split
              </CardTitle>
              <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20">
                $130,000 GMV
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Sales revenue &amp; order distribution across connected storefront channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ECOMMERCE_SPLIT_DATA} layout="vertical">
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="category" stroke="#888888" fontSize={12} tickLine={false} width={100} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="sales" name="Sales ($)" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Campaign Performance (Multichannel Engagement) */}
        <Card className="shadow-none border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500" />
                Campaign Performance
              </CardTitle>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                75,600 Impressions
              </Badge>
            </div>
            <CardDescription className="text-body-sm">
              Open rates and click-through metrics across Email, Banner, and Popup broadcasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CAMPAIGN_PERFORMANCE_DATA}>
                  <XAxis dataKey="channel" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} unit="%" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="openRate" name="Open Rate (%)" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clickRate" name="Click Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
