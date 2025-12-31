import ProductCard from './ProductCard';
import { bestSellers } from '../../data/products';

export default function BestSellers() {
    return (
        <div className="bg-zinc-50 py-16 sm:py-24 dark:bg-zinc-900/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Best Sellers</h2>
                    <p className="mt-4 text-zinc-500 dark:text-zinc-400">Our most popular designs, loved by our customers.</p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {bestSellers.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
