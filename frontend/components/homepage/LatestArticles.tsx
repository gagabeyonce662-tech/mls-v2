"use client";

export default function LatestArticles() {
  const articles = [
    {
      id: 1,
      title: "Marketing negotiation tips for buyers and sellers",
      category: "REAL ESTATE",
      date: "April 20, 2021",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    },
    {
      id: 2,
      title: "How inflation impacts property value insights guide book",
      category: "PROPERTY",
      date: "April 20, 2021",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
    },
    {
      id: 3,
      title: "The Power of Natural Light in Architecture Design",
      category: "ARCHITECTURE",
      date: "April 20, 2021",
      excerpt:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-ds-h2 text-ds-heading font-inter">Latest Articles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="group cursor-pointer">
              <div className="relative h-56 rounded-xl overflow-hidden mb-4">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-xs font-bold">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-ds-small-regular text-ds-body font-inter">{article.date}</p>
                <h3 className="text-ds-h5 text-ds-heading group-hover:text-ds-primary transition-colors font-inter">
                  {article.title}
                </h3>
                <p className="text-ds-body-regular text-ds-body font-inter">{article.excerpt}</p>
                <button className="text-ds-primary font-semibold hover:underline font-inter">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
