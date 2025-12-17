"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

const userSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "STAFF"]),
    imageUrl: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    user?: any;
}

export function UserForm({
    open,
    onOpenChange,
    onSubmit,
    user,
}: UserFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Custom validation to require password for new users
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            role: "STAFF",
            imageUrl: "",
        },
    });

    const watchImageUrl = watch("imageUrl");

    useEffect(() => {
        if (open) {
            if (user) {
                reset({
                    fullName: user.fullName,
                    email: user.email,
                    password: "", // Don't fill password on edit
                    role: user.role,
                    imageUrl: user.imageUrl || "",
                });
            } else {
                reset({
                    fullName: "",
                    email: "",
                    password: "",
                    role: "STAFF",
                    imageUrl: "",
                });
            }
        }
    }, [user, reset, open]);

    const handleFormSubmit = async (data: UserFormData) => {
        // Validate password for new users manually since zod optional doesn't cover conditional logic easily without refine
        if (!user && !data.password) {
            // We need to set error manually or just return (better to declare schema with refine but keeping simple here)
            // For now let's hope the backend catches it or we add a check
            // Actually best to use refine in schema but let's just alert
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error("Form submission error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update user details below." : "Create a new staff account."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="flex justify-center">
                            <div className="w-32">
                                <ImageUpload
                                    value={watchImageUrl}
                                    onChange={(url) => setValue("imageUrl", url)}
                                    onRemove={() => setValue("imageUrl", "")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
                        {errors.fullName && (
                            <p className="text-sm text-red-600">{errors.fullName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password {user && "(Leave blank to keep current)"}</Label>
                        <Input id="password" type="password" {...register("password")} placeholder="******" />
                        {!user && !watch("password") && (
                            <p className="text-xs text-amber-600">Password is required for new users</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={watch("role")}
                            onValueChange={(value: "ADMIN" | "STAFF") => setValue("role", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || (!user && !watch("password"))}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {user ? "Update User" : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
