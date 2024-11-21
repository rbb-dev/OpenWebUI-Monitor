import Link from "next/link";
import { FiDatabase, FiUsers, FiBarChart2 } from "react-icons/fi";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 -z-20" />

      {/* 装饰图形 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-br-full opacity-40 -z-10" />
      <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-pink-200 rounded-tl-full opacity-40 -z-10" />

      {/* 主要内容 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* 标题区域 */}
        <div className="w-full text-center mb-16 relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-20 w-[30rem] h-[30rem] bg-purple-200 rounded-full blur-3xl opacity-30 -z-10" />
          <h1 className="text-6xl font-bold text-gray-800 mb-6 animate-fade-in">
            OpenWebUI Monitor
          </h1>
        </div>

        {/* 卡片网格 */}
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 px-4">
          {/* Models 卡片 */}
          <Link
            href="/models"
            className="group transform hover:-translate-y-2 hover:scale-105 transition-all duration-300"
          >
            <div
              className="h-full bg-red-100 backdrop-blur-lg rounded-2xl shadow-xl p-8 
                          border border-transparent hover:border-indigo-100 
                          transition-all duration-300 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 bg-indigo-100 rounded-bl-full opacity-30 -z-10 
                            group-hover:scale-150 transition-transform duration-500"
              />
              <div className="flex items-center mb-6">
                <FiDatabase className="text-4xl text-indigo-500 group-hover:text-indigo-600 mr-4" />
                <h2 className="text-2xl font-semibold text-indigo-500 group-hover:text-indigo-600">
                  模型管理
                </h2>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700 text-lg">
                查看和管理所有模型数据，包括价格设置和详细信息
              </p>
            </div>
          </Link>

          {/* Users 卡片 */}
          <Link
            href="/users"
            className="group transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 md:translate-y-12"
          >
            <div
              className="h-full bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 
                          border border-transparent hover:border-purple-100 
                          transition-all duration-300 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 bg-purple-100 rounded-bl-full opacity-30 -z-10 
                            group-hover:scale-150 transition-transform duration-500"
              />
              <div className="flex items-center mb-6">
                <FiUsers className="text-4xl text-purple-500 group-hover:text-purple-600 mr-4" />
                <h2 className="text-2xl font-semibold text-purple-500 group-hover:text-purple-600">
                  用户管理
                </h2>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700 text-lg">
                管理系统用户，查看用户信息和权限设置
              </p>
            </div>
          </Link>

          {/* Panel 卡片 */}
          <Link
            href="/panel"
            className="group transform hover:-translate-y-2 hover:scale-105 transition-all duration-300"
          >
            <div
              className="h-full bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 
                          border border-transparent hover:border-green-100 
                          transition-all duration-300 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 bg-green-100 rounded-bl-full opacity-30 -z-10 
                            group-hover:scale-150 transition-transform duration-500"
              />
              <div className="flex items-center mb-6">
                <FiBarChart2 className="text-4xl text-green-500 group-hover:text-green-600 mr-4" />
                <h2 className="text-2xl font-semibold text-green-500 group-hover:text-green-600">
                  使用统计
                </h2>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700 text-lg">
                查看系统使用统计数据和详细使用记录
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
