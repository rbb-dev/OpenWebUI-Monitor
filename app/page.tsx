import Link from "next/link";
import { FiDatabase, FiUsers, FiBarChart2, FiGithub } from "react-icons/fi";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 - 使用更柔和的渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50 -z-20" />

      {/* 装饰图形 - 更细腻的装饰元素 */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-blue-50/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-rose-50/40 rounded-full blur-3xl -z-10" />

      {/* 主要内容 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* 标题区域 */}
        <div className="w-full text-center mb-20 relative">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            OpenWebUI Monitor
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            专为 OpenWebUI 设计的用量监控和用户余额管理平台
          </p>
        </div>

        {/* 卡片网格 - 更现代的卡片设计 */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {/* Models 卡片 */}
          <Link
            href="/models"
            className="group hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className="h-full bg-white/70 backdrop-blur-sm rounded-2xl p-8 
                          border border-gray-100 shadow-sm hover:shadow-md 
                          transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-50 rounded-xl mr-4">
                  <FiDatabase className="text-2xl text-blue-500" />
                </div>
                <h2 className="text-xl font-medium text-gray-800">模型管理</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                OpenWebUI 提供模型的价格管理
              </p>
            </div>
          </Link>

          {/* Users 卡片 */}
          <Link
            href="/users"
            className="group hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className="h-full bg-white/70 backdrop-blur-sm rounded-2xl p-8 
                          border border-gray-100 shadow-sm hover:shadow-md 
                          transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-purple-50 rounded-xl mr-4">
                  <FiUsers className="text-2xl text-purple-500" />
                </div>
                <h2 className="text-xl font-medium text-gray-800">用户管理</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                用户信息查询和余额管理
              </p>
            </div>
          </Link>

          {/* Panel 卡片 */}
          <Link
            href="/panel"
            className="group hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className="h-full bg-white/70 backdrop-blur-sm rounded-2xl p-8 
                          border border-gray-100 shadow-sm hover:shadow-md 
                          transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-50 rounded-xl mr-4">
                  <FiBarChart2 className="text-2xl text-green-500" />
                </div>
                <h2 className="text-xl font-medium text-gray-800">使用统计</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                使用统计数据和可视化
              </p>
            </div>
          </Link>
        </div>

        {/* 修改 GitHub 链接部分 */}
        <div className="absolute bottom-4 text-gray-400 text-sm">
          <a
            href="https://github.com/VariantConst/OpenWebUI-Monitor"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <FiGithub className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
