import Hero from "../components/Hero";
import NewArrivals from "../components/NewArrivals";
import BestSellers from "../components/BestSellers";
import Reviews from "../components/Reviews";

export default function Home() {
  return (
    <div className="w-full">
      <Hero />
      <NewArrivals />
      <BestSellers />
      <Reviews />
    </div>
  );
}
