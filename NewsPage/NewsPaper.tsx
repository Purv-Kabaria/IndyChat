// NewsPaper.tsx
import React from 'react';
import NewsPage from './NewsPage';
import { news } from './news';

export default function NewsPaper() {
  return (
    <div
      className="flex justify-center border-4 border-black m-8 bg-cover bg-center"
      style={{
        backgroundImage:
          'url("https://t4.ftcdn.net/jpg/03/05/31/73/360_F_305317368_3SK41rN0Nv0ifA5Oan5fIufacQYDX19R.jpg")',
      }}
    >
      <NewsPage
        news1={news[0]}
        news2={news[1]}
        news3={news[2]}
        news4={news[3]}
      />
      <div className="w-0 border-l border-dashed border-gray-500 mx-2"></div>
      <NewsPage
        news1={news[4]}
        news2={news[5]}
        news3={news[6]}
        news4={news[7]}
      />
    </div>
  );
}
