"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Post {
  id: string;
  views: number;
  interactions: number;
  shares: number;
  comments: number;
  createdAt: Date;
}

interface RuleStatsChartProps {
  posts: Post[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export function RuleStatsChart({ posts }: RuleStatsChartProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Dữ liệu cho biểu đồ cột - so sánh các bài đăng
  const barChartData = posts.map((post, index) => ({
    name: `Bài ${index + 1}`,
    views: post.views,
    interactions: post.interactions,
    shares: post.shares,
    comments: post.comments,
  }));

  // Dữ liệu tổng cho biểu đồ tròn
  const totalStats = posts.reduce(
    (acc, post) => ({
      views: acc.views + post.views,
      interactions: acc.interactions + post.interactions,
      shares: acc.shares + post.shares,
      comments: acc.comments + post.comments,
    }),
    { views: 0, interactions: 0, shares: 0, comments: 0 }
  );

  const pieChartData = [
    { name: "Lượt xem", value: totalStats.views },
    { name: "Tương tác", value: totalStats.interactions },
    { name: "Chia sẻ", value: totalStats.shares },
    { name: "Bình luận", value: totalStats.comments },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Biểu đồ cột - So sánh các bài đăng */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">So sánh các bài đăng</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatNumber(value)} />
            <Legend />
            <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Lượt xem" />
            <Bar dataKey="interactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tương tác" />
            <Bar dataKey="shares" fill="#10b981" radius={[4, 4, 0, 0]} name="Chia sẻ" />
            <Bar dataKey="comments" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bình luận" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Biểu đồ đường - Xu hướng */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Xu hướng theo thời gian</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={barChartData}>
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
      </div>

      {/* Biểu đồ tròn - Phân bố */}
      {pieChartData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 lg:col-span-2">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Phân bố tương tác</h4>
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-center">
            <ResponsiveContainer width="100%" height={250} maxWidth={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {pieChartData.map((item, index) => {
                const total = pieChartData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.name} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-medium text-gray-600">{item.name}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(item.value)}</p>
                    <p className="text-xs text-gray-500">{percentage}% tổng</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

