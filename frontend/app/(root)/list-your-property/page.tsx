import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import ListYourPropertyForm from "@/components/listing-submissions/ListYourPropertyForm";

export default function ListYourPropertyPage() {
  return <div className="min-h-screen bg-gray-50"><Header /><main className="pt-32 pb-20"><Container><div className="mx-auto max-w-3xl"><div className="mb-10 text-center"><h1 className="text-4xl font-extrabold text-ds-heading">List your property</h1><p className="mx-auto mt-3 max-w-2xl text-ds-body">Submit your property for our team to review. It will never appear as an MLS® listing, and it is not public until approved.</p></div><ListYourPropertyForm /></div></Container></main><Footer /></div>;
}
