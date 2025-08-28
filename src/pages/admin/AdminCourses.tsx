
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, MoreVertical, Edit, Trash, Eye, CheckCircle, XCircle, CheckSquare, Square, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { serverURL } from '@/constants';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Course {
  _id: string;
  user: string;
  content: string;
  type: string;
  mainTopic: string;
  photo?: string;
  date: string;
  end: string;
  completed: boolean;
  approved: boolean;
  category?: string;
  tags?: string[];
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

const AdminCourses = () => {
  const [data, setData] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered data using memoization for better performance
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((course) => {
        const nameMatch = course.mainTopic?.toLowerCase().includes(query);
        const userMatch = course.user?.toLowerCase().includes(query);
        const contentMatch = course.content?.toLowerCase().includes(query);
        return nameMatch || userMatch || contentMatch;
      });
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(course => course.category === filterCategory);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'approved') {
        filtered = filtered.filter(course => course.approved);
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(course => !course.approved);
      } else if (filterStatus === 'completed') {
        filtered = filtered.filter(course => course.completed);
      }
    }
    
    return filtered;
  }, [data, searchQuery, filterCategory, filterStatus]);

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/getcourses`;
      const response = await axios.get(postURL);
      setData(response.data);
      setIsLoading(false);
    }
    dashboardData();
  }, []);

  // Handle course selection for bulk operations
  const handleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Handle select all courses
  const handleSelectAll = () => {
    if (selectedCourses.length === filteredData.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredData.map(course => course._id));
    }
  };

  // Handle course editing
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditDialogOpen(true);
  };

  // Handle course deletion
  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Save course changes
  const saveCourseChanges = async () => {
    if (!editingCourse) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/updatecourse', {
        courseId: editingCourse._id,
        updates: editingCourse
      });
      
      if (response.data.success) {
        setData(prev => prev.map(course => 
          course._id === editingCourse._id ? editingCourse : course
        ));
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingCourse(null);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete course
  const deleteCourse = async () => {
    if (!courseToDelete) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/deletecourse', {
        courseId: courseToDelete._id
      });
      
      if (response.data.success) {
        setData(prev => prev.filter(course => course._id !== courseToDelete._id));
        setSelectedCourses(prev => prev.filter(id => id !== courseToDelete._id));
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setCourseToDelete(null);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk delete courses
  const bulkDeleteCourses = async () => {
    if (selectedCourses.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/bulkdeletecourses', {
        courseIds: selectedCourses
      });
      
      if (response.data.success) {
        setData(prev => prev.filter(course => !selectedCourses.includes(course._id)));
        setSelectedCourses([]);
        toast({
          title: "Success",
          description: `${selectedCourses.length} courses deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete courses",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete courses",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk approve courses
  const bulkApproveCourses = async () => {
    if (selectedCourses.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/bulkapprovecourses', {
        courseIds: selectedCourses
      });
      
      if (response.data.success) {
        setData(prev => prev.map(course => 
          selectedCourses.includes(course._id) ? { ...course, approved: true } : course
        ));
        setSelectedCourses([]);
        toast({
          title: "Success",
          description: `${selectedCourses.length} courses approved successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to approve courses",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve courses",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = data.map(course => course.category).filter(Boolean);
    return ['all', ...Array.from(new Set(categories))];
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course catalog</p>
        </div>
        <div className="flex gap-2">
          {selectedCourses.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={bulkApproveCourses}
                disabled={isProcessing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected ({selectedCourses.length})
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedCourses.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Multiple Courses</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedCourses.length} courses? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={bulkDeleteCourses}>
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Courses ({filteredData.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 w-6 p-0"
                  >
                    {selectedCourses.length === filteredData.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                {filteredData.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCourseSelection(course._id)}
                        className="h-6 w-6 p-0"
                      >
                        {selectedCourses.includes(course._id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {course.mainTopic || 'Untitled Course'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.type === 'video & text course' ? 'default' : 'secondary'}>
                        {course.type === 'video & text course' ? 'Video' : 'Text'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.category ? (
                        <Badge variant="outline">
                          <Tag className="mr-1 h-3 w-3" />
                          {course.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={course.approved ? 'default' : 'secondary'}>
                          {course.approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <Badge variant={course.completed ? 'default' : 'outline'}>
                          {course.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {course.user || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      {new Date(course.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCourse(course)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>No courses match your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Make changes to course information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingCourse && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={editingCourse.mainTopic || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, mainTopic: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingCourse.type}
                  onValueChange={(value) => setEditingCourse({ ...editingCourse, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory & image course">Text Course</SelectItem>
                    <SelectItem value="video & text course">Video Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input
                  id="category"
                  value={editingCourse.category || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Technology, Business, Health"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficulty" className="text-right">
                  Difficulty
                </Label>
                <Select
                  value={editingCourse.difficulty || 'beginner'}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                    setEditingCourse({ ...editingCourse, difficulty: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={editingCourse.tags?.join(', ') || ''}
                  onChange={(e) => setEditingCourse({ 
                    ...editingCourse, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="col-span-3"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approved" className="text-right">
                  Status
                </Label>
                <div className="col-span-3 flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="approved"
                      checked={editingCourse.approved}
                      onChange={(e) => setEditingCourse({ ...editingCourse, approved: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="approved">Approved</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="completed"
                      checked={editingCourse.completed}
                      onChange={(e) => setEditingCourse({ ...editingCourse, completed: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="completed">Completed</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCourseChanges} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.mainTopic || 'this course'}"? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCourses;
