"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useToast } from "@/hooks/use-toast";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { register: registerUser } = useUserAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpValues) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      toast({
        title: "Account created!",
        description: "Welcome to Estate-4u. Your account is ready.",
      });
      router.push(nextPath);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ds-heading">
          Create an Account
        </h1>
        <p className="text-ds-body">
          Join us today and find your perfect home.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <User className="w-4 h-4" />
            </div>
            <Input
              id="name"
              placeholder="John Doe"
              className="pl-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Phone className="w-4 h-4" />
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="(123) 456-7890"
              className="pl-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-10 pr-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-body hover:text-ds-heading transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-body group-focus-within:text-ds-primary transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="confirmPassword"
              type="password"
              className="pl-10 h-12 transition-all border-ds-card-border focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg active:scale-[0.98] mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-ds-body">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-ds-primary hover:underline transition-colors underline-offset-4"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-ds-body/70 px-4">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ds-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-ds-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
