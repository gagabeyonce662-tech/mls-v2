"use client";

import { Star, ArrowUpRight } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BlogPost } from "@/types/blogPost";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
}

const getCategoryVariant = (
  category: string,
): "default" | "secondary" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    "Market Analysis": "default",
    Buying: "default",
    Investment: "secondary",
    Financing: "outline",
    Selling: "default",
    Legal: "secondary",
    Neighbourhoods: "outline",
  };
  return variants[category] || "default";
};

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/50",
        "rounded-2xl bg-gradient-to-b from-background/60 to-background/40",
        "backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300",
        "hover:border-primary/50 hover:scale-[1.02] cursor-pointer flex flex-col h-full",
      )}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={
            post.thumbnail ||
            "https://plus.unsplash.com/premium_photo-1664476845274-27c2dabdd7f0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&fm=jpg&q=60&w=3000"
          }
          alt={post.title}
          width={320}
          height={192}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Floating Badge */}
        <Badge
          variant={getCategoryVariant(post.category?.name)}
          className="absolute top-3 left-3 bg-white/90 text-black backdrop-blur-sm shadow-sm px-2 py-1 text-xs font-medium"
        >
          {post.category?.name || "Uncategorized"}
        </Badge>

        {/* Floating Icon */}
        <div className="absolute top-3 right-3 bg-primary/90 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 -translate-y-2">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Content */}
      <CardHeader className="flex-1 p-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-2 text-muted-foreground/80">
          {post.excerpt}
        </CardDescription>
      </CardHeader>

      {/* Footer */}
      <CardContent className="p-5">
        <Separator className="mb-4 bg-border/40" />
        <div className="flex items-center justify-between text-sm">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 ring-1 ring-border/40">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {typeof post.author === "string"
                  ? post.author.substring(0, 2).toUpperCase()
                  : `A${post.author || "N"}`}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground font-medium">
              {post.author || "Admin"}
            </span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-2 text-muted-foreground/80">
            {post.views && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {post.views}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />
    </Card>
  );
}
