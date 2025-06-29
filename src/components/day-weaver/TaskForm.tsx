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
import { PlusCircle } from 'lucide-react';
import type { Task, TaskPriority } from '@/lib/types';

type TaskFormProps = {
  onAddTask: (task: Omit<Task, 'id'>) => void;
};

const formSchema = z.object({
  name: z.string().min(2, 'Task name must be at least 2 characters.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  priority: z.enum(['low', 'medium', 'high']),
});

type FormValues = z.infer<typeof formSchema>;

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      duration: 30,
      priority: 'medium',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    onAddTask({
      name: data.name,
      duration: data.duration,
      priority: data.priority as TaskPriority,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Add a new task..." {...field} />
              </FormControl>
              <FormMessage className="mt-1" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
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
        <Button type="submit" size="icon" className="shrink-0" aria-label="Add Task">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </form>
    </Form>
  );
}
