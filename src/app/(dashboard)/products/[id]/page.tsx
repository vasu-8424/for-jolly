"use client";

import { use, useEffect, useState } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { ProductForm } from "@/components/products/product-form";
import { getProductById } from "@/actions/products";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const isNew = resolvedParams.id === "new";
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      return;
    }

    async function fetchProduct() {
      setIsLoading(true);
      const data = await getProductById(resolvedParams.id);
      if (!data) {
        alert("Product not found");
        router.push("/products");
        return;
      }
      setProduct(data);
      setIsLoading(false);
    }
    fetchProduct();
  }, [resolvedParams.id, isNew, router]);

  if (isNew) {
    return (
      <PageTransition>
        <div className="pb-8">
          <ProductForm />
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="pb-8">
        <ProductForm key={product?.id || "product-form"} initialData={product} />
      </div>
    </PageTransition>
  );
}

