// NewsPage.tsx
import React from 'react';
import NewsCard from './NewsCard';

type News = {
  title: string;
  image: string;
  date: string;
  time: string;
  place: string;
  fullDesc: string;
};

type Props = {
  news1: News;
  news2: News;
  news3: News;
  news4: News;
};

export default function NewsPage({ news1, news2, news3, news4 }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="border-2 border-black m-2 border-spacing-2 text-sm w-full table-fixed">
        <caption className="border-2 border-black m-1 rounded-md font-serif text-lg font-semibold">
          <h1 className="font-imfell text-3xl">INDIANAPOLIS DAILY CHRONICLE</h1>
        </caption>
        <tbody>
          <tr>
            <td rowSpan={5} colSpan={2} className="h-[55vh] w-[22vw] align-top">
              <NewsCard news={news1} />
            </td>
            <td rowSpan={4} colSpan={2} className="h-[45vh] w-[22vw] align-top">
              <NewsCard news={news2} />
            </td>
          </tr>
          <tr></tr>
          <tr></tr>
          <tr></tr>
          <tr>
            <td colSpan={2} rowSpan={4} className="h-[45vh] w-[22vw] align-top">
              <NewsCard news={news3} />
            </td>
          </tr>
          <tr>
            <td rowSpan={3} colSpan={2} className="h-[35vh] w-[22vw] align-top">
              <NewsCard news={news4} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
