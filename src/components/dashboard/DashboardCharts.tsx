"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface PostData {
  views: number;
  interactions: number;
  shares: number;
  comments: number;
}

interface DashboardChartsProps {
  totalStats: {
    views: number;
    interactions: number;
    shares: number;
    comments: number;
  };
  postsData: PostData[];
}

export function DashboardCharts({ totalStats, postsData }: DashboardChartsProps) {
  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = [
    {
      name: "Lượt xem",
      value: totalStats.views,
      color: "#3b82f6",
    },
    {
      name: "Tương tác",
      value: totalStats.interactions,
      color: "#8b5cf6",
    },
    {
      name: "Chia sẻ",
      value: totalStats.shares,
      color: "#10b981",
    },
    {
      name: "Bình luận",
      value: totalStats.comments,
      color: "#f59e0b",
    },
  ];

  // Dữ liệu theo thời gian (giả lập - có thể cải thiện sau)
  const timeSeriesData = postsData.slice(0, 10).map((post, index) => ({
    name: `Bài ${index + 1}`,
    views: post.views,
    interactions: post.interactions,
    shares: post.shares,
    comments: post.comments,
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Biểu đồ cột - Tổng thống kê */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Tổng thống kê</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatNumber(value)} />
            <Legend />
            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Biểu đồ đường - Xu hướng */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Xu hướng bài đăng</h3>
        {timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatNumber(value)} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Lượt xem" />
              <Line type="monotone" dataKey="interactions" stroke="#8b5cf6" strokeWidth={2} name="Tương tác" />
              <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2} name="Chia sẻ" />
              <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2} name="Bình luận" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-400">
            <p>Chưa có dữ liệu bài đăng</p>
          </div>
        )}
      </div>

      {/* Biểu đồ tròn - Phân bố */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Phân bố tương tác</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {chartData.map((item) => {
            const total = chartData.reduce((sum, d) => sum + d.value, 0);
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{item.name}</span>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(item.value)}</p>
                <p className="text-xs text-gray-500">{percentage}% tổng</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

