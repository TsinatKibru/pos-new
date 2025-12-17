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
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-600 mt-1">Manage your account settings</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Update your personal information and password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Avatar</Label>
                                <div className="flex justify-center sm:justify-start">
                                    <div className="w-32">
                                        <ImageUpload
                                            value={watchImageUrl}
                                            onChange={(url) => setValue("imageUrl", url)}
                                            onRemove={() => setValue("imageUrl", "")}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
                                    {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password (Optional)</Label>
                                <Input id="password" type="password" {...register("password")} placeholder="Leave blank to keep current" />
                                <p className="text-xs text-slate-500">Only fill this if you want to change your password.</p>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
