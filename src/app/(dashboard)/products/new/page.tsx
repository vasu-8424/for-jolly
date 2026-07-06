"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <PageTransition>
      <div className="pb-8">
        <ProductForm />
      </div>
    </PageTransition>
  );
}
