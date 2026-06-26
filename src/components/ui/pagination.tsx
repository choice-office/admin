import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
	<nav
		aria-label="페이지 내비게이션"
		data-slot="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);

const PaginationContent = ({ className, ...props }: React.ComponentProps<"ul">) => (
	<ul
		data-slot="pagination-content"
		className={cn("flex items-center gap-0.5", className)}
		{...props}
	/>
);

const PaginationItem = ({ ...props }: React.ComponentProps<"li">) => (
	<li data-slot="pagination-item" {...props} />
);

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
	React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
	<Button
		variant={isActive ? "outline" : "ghost"}
		size={size}
		className={cn(className)}
		nativeButton={false}
		render={
			<a
				aria-current={isActive ? "page" : undefined}
				data-slot="pagination-link"
				data-active={isActive}
				{...props}
			/>
		}
	/>
);

const PaginationPrevious = ({
	className,
	text = "이전",
	...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) => (
	<PaginationLink
		aria-label="이전 페이지로"
		size="default"
		className={cn("pl-1.5!", className)}
		{...props}
	>
		<ChevronLeftIcon data-icon="inline-start" />
		<span className="hidden sm:block">{text}</span>
	</PaginationLink>
);

const PaginationNext = ({
	className,
	text = "다음",
	...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) => (
	<PaginationLink
		aria-label="다음 페이지로"
		size="default"
		className={cn("pr-1.5!", className)}
		{...props}
	>
		<span className="hidden sm:block">{text}</span>
		<ChevronRightIcon data-icon="inline-end" />
	</PaginationLink>
);

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		data-slot="pagination-ellipsis"
		className={cn(
			"flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		{...props}
	>
		<MoreHorizontalIcon />
		<span className="sr-only">더 보기</span>
	</span>
);

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
