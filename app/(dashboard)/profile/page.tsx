"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    imageUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            imageUrl: "",
        },
    });

    const watchImageUrl = watch("imageUrl");

    useEffect(() => {
        if (session?.user) {
            // Fetch fresh user data just in case
            // But for now session might be enough, or better fetch from API to get latest
            // Let's use session basic info but ideally we fetch /api/users/me or similar?
            // We can just use the user ID from session to fetch details if we had a single user endpoint.
            // Or filter from /api/users (not efficient but works for now as we don't have /api/me)
            // Let's rely on session + local state updates for now or just fetch all and find.
            // Actually we can enable GET on /api/users/[id]
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        // We need a way to get current user data. 
        // We don't have GET /api/users/[id] implemented yet. 
        // Let's implement GET in /api/users/[id] quickly or just rely on the list.
        // Wait, I didn't implement GET in [id]/route.ts. 
        // Let's implement it or use list. List is easier for MVP.
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                const me = users.find((u: any) => u.email === session?.user?.email);
                if (me) {
                    setUser(me);
                    reset({
                        fullName: me.fullName,
                        email: me.email,
                        password: "",
                        imageUrl: me.imageUrl || "",
                    });
                }
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    }


    const handleFormSubmit = async (data: ProfileFormData) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully");
            // Update session if needed (NextAuth session update is tricky client side without trigger)
            // We can try calling update()
            await updateSession({
                ...session,
                user: {
                    ...session?.user,
                    name: data.fullName,
                    email: data.email,
                    image: data.imageUrl // if we map it
                }
            });

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your account settings and preferences.</p>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar / Avatar Section */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-900 text-white pb-8">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-medium">Public Profile</CardTitle>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${user?.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-100' : 'bg-blue-500/20 text-blue-100'
                                            }`}>
                                            {user?.role || 'STAFF'}
                                        </span>
                                    </div>
                                    <CardDescription className="text-slate-400">
                                        Your visible information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 -mt-6">
                                    <div className="flex flex-col items-center">
                                        <div className="rounded-full p-1 bg-white shadow-lg">
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 bg-slate-100">
                                                <ImageUpload
                                                    value={watchImageUrl}
                                                    onChange={(url) => setValue("imageUrl", url)}
                                                    onRemove={() => setValue("imageUrl", "")}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <h3 className="font-semibold text-lg text-slate-900">
                                                {watch("fullName") || "Your Name"}
                                            </h3>
                                            <p className="text-sm text-slate-500">{watch("email") || "your@email.com"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your basic profile details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                {...register("fullName")}
                                                placeholder="John Doe"
                                                className="bg-slate-50/50"
                                            />
                                            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                placeholder="john@example.com"
                                                className="bg-slate-50/50"
                                            />
                                            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Ensure your account is secure using a strong password.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register("password")}
                                            placeholder="Leave blank to keep current"
                                            className="bg-slate-50/50"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Minimum 6 characters recommended. Leave empty if you don't want to change it.
                                        </p>
                                    </div>
                                </CardContent>
                                <div className="p-6 pt-0 border-t bg-slate-50/30 flex justify-end rounded-b-lg">
                                    <Button type="submit" disabled={isLoading} className="mt-4 min-w-[120px]">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
