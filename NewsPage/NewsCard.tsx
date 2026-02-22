// NewsCard.tsx
import React from 'react';

type News = {
  title: string;
  image: string;
  date: string;
  time: string;
  place: string;
  fullDesc: string;
};

type Props = {
  news: News;
};

export default function NewsCard({ news }: Props) {
  return (
    <div className="text-center flex flex-col h-full w-[95%] overflow-auto p-2 pr-5">
      <h3 className="text-lg font-semibold mb-2 font-times">{news.title}</h3>
      <div className="flex items-start mb-2">
        <img src={news.image} alt={news.title} className="w-1/2 mr-2 mb-2" />
        <div className="mt-1 text-left text-sm space-y-1">
          <p>{news.date}</p>
          <p>{news.time}</p>
          <p>{news.place}</p>
        </div>
      </div>
      <p className="text-justify text-sm">{news.fullDesc}</p>
    </div>
  );
}
