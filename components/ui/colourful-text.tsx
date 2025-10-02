"use client";
import React from "react";
import { motion } from "motion/react";

export default function ColourfulText({ text }: { text: string }) {
	const rainbow = ["#F94144", "#F3722C", "#F8961E", "#F9844A", "#F9C74F", "#90BE6D", "#43AA8B", "#4D908E", "#577590", "#277DA1"];

	return text.split("").map((char, index) => (
		<motion.span
			key={`${char}-${index}`}
			initial={{ y: 0 }}
			animate={{
				color: rainbow[index % rainbow.length],
				y: [0, -3, 0],
				scale: [1, 1.01, 1],
				filter: ["blur(0px)", "blur(5px)", "blur(0px)"],
				opacity: [1, 0.8, 1],
			}}
			transition={{
				duration: 0.5,
				delay: index * 0.05,
			}}
			className="inline-block whitespace-pre font-sans tracking-tight">
			{char}
		</motion.span>
	));
}
