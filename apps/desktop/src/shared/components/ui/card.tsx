import { cn } from '../../utils/tailwind';

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn('bg-card text-card-foreground rounded-xl border shadow', className)}
      {...rest}
    />
  );
}

function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...rest} />;
}

function CardTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={cn('leading-none font-semibold tracking-tight', className)} {...rest} />;
}

function CardDescription(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={cn('text-muted-foreground text-sm', className)} {...rest} />;
}

function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={cn('p-6 pt-0', className)} {...rest} />;
}

function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div className={cn('flex items-center p-6 pt-0', className)} {...rest} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
