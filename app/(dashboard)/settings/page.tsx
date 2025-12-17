"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        storeName: "",
        address: "",
        phone: "",
        email: "",
        currency: "USD",
        taxRate: 10,
        loyaltyRate: 1,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/settings");
            if (!response.ok) throw new Error("Failed to fetch settings");
            const data = await response.json();
            setFormData({
                storeName: data.storeName || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || "",
                currency: data.currency || "USD",
                taxRate: data.taxRate ? Number(data.taxRate) : 10,
                loyaltyRate: data.loyaltyRate ? Number(data.loyaltyRate) : 1,
            });
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    taxRate: Number(formData.taxRate),
                    loyaltyRate: Number(formData.loyaltyRate),
                }),
            });

            if (!response.ok) throw new Error("Failed to save settings");

            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Store Settings</h1>
                    <p className="text-slate-600 mt-1">Configure your store details and preferences</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>
                                These details will appear on your printed receipts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store Name</Label>
                                <Input
                                    id="storeName"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    placeholder="My Awesome Store"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Main St, City, Country"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@store.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency Code</Label>
                                    <Input
                                        id="currency"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        placeholder="USD"
                                        maxLength={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                    <Input
                                        id="taxRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.taxRate}
                                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                                        placeholder="10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="loyaltyRate">Loyalty Points per $1</Label>
                                    <Input
                                        id="loyaltyRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.loyaltyRate}
                                        onChange={(e) => setFormData({ ...formData, loyaltyRate: Number(e.target.value) })}
                                        placeholder="1"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Configure earning rate above. Redemption value is fixed: 20 points = $1.00 discount.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={saving} className="gap-2">
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
