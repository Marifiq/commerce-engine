import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import NewArrivals from "../components/NewArrivals";
import BestSellers from "../components/BestSellers";
import Reviews from "../components/Reviews";

export default function Home() {
  return (
    <div className="w-full">
      <Hero />
      <CategorySection />
      <NewArrivals />
      <BestSellers />
      <Reviews />
    </div>
  );
}
