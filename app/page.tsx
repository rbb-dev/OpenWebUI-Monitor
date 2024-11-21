import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          欢迎来到管理系统
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Models 卡片 */}
          <Link
            href="/models"
            className="transform hover:scale-105 transition-transform duration-200"
          >
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
                模型管理
              </h2>
              <p className="text-gray-600">
                查看和管理所有模型数据，包括价格设置和详细信息
              </p>
            </div>
          </Link>

          {/* Users 卡片 */}
          <Link
            href="/users"
            className="transform hover:scale-105 transition-transform duration-200"
          >
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl">
              <h2 className="text-2xl font-semibold text-purple-600 mb-4">
                用户管理
              </h2>
              <p className="text-gray-600">
                管理系统用户，查看用户信息和权限设置
              </p>
            </div>
          </Link>

          {/* Panel 卡片 */}
          <Link
            href="/panel"
            className="transform hover:scale-105 transition-transform duration-200"
          >
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl">
              <h2 className="text-2xl font-semibold text-green-600 mb-4">
                使用统计
              </h2>
              <p className="text-gray-600">
                查看系统使用统计数据和详细使用记录
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
