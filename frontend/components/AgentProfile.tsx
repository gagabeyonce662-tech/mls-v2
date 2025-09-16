import Image from 'next/image';

export default function AgentProfile() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Gunneet Singh
            </h2>
            <p className="text-xl text-teal-700 font-semibold mb-2">
              REALTOR®
            </p>
            <p className="text-lg text-gray-600 mb-8">
              TFN Realty
            </p>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                I am Gunneet Singh, an experienced real estate agent specialized in the Canadian market. 
                My expertise lies specifically in the GTA real estate market. With a deep understanding 
                of the local real estate landscape and a passion for helping clients achieve their goals, 
                I am committed to providing exceptional service and expert guidance.
              </p>
              <p>
                Whether you're buying, selling, or investing in or outside the GTA, I offer personalized 
                solutions tailored to your unique needs. My extensive knowledge of neighborhoods, market 
                trends, and property values ensures that you make informed decisions every step of the way.
              </p>
              <p>
                Trust me to be your reliable partner in navigating the dynamic GTA real estate market. 
                Let's work together to turn your real estate dreams into reality!
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=500&h=500"
                alt="Gunneet Singh - Real Estate Agent"
                width={400}
                height={400}
                className="rounded-full object-cover shadow-2xl"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-700/20 to-orange-600/20"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}