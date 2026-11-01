import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Landing from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <PublicLayout />,
		// errorElement: (
		// 	<Error404 />
		// ),
		children: [
			{
				index: true,
				element: <Landing />,
			},
			// {
			// 	path: "/AboutUs",
			// 	element: <AboutUs />,
			// },
		],
	},
	// {
	// 	element: <PrivateLayout />,
	// 	children: [
	// 		{
	// 			path: "/EditProfile",
	// 			element: <EditProfile />,
	// 		},
	// 		{
	// 			path: "/DashBoard",
	// 			element: <DashBoard />,
	// 		},
	// 	],
	// },
	{
		element: <AuthLayout />,
		children: [
			{
				path: "/login",
				element: <LoginPage />,
			},
		],
	},
]);