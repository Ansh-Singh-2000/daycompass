'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import type { Task, TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TaskFormProps = {
  onAddTask: (task: Omit<Task, 'id'>) => void;
};

const formSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters.'),
  estimatedTime: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      estimatedTime: 30,
      priority: 'medium',
      deadline: undefined,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    onAddTask({
      title: data.title,
      estimatedTime: data.estimatedTime,
      priority: data.priority as TaskPriority,
      deadline: data.deadline,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Add a new task..." {...field} />
                </FormControl>
                <FormMessage className="mt-1" />
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="shrink-0" aria-label="Add Task">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="estimatedTime"
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Mins"
                      {...field}
                      className="pr-12 text-right"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground pointer-events-none">
                      min
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="w-[120px]">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="mt-1" />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex-1">
                 <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a deadline</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
