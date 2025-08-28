
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, MoreVertical, Edit, Trash, Eye, Shield, User, CheckSquare, Square } from 'lucide-react';
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

interface User {
  _id: string;
  email: string;
  mName: string;
  type: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

const AdminUsers = () => {
  const [data, setData] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered data using memoization for better performance
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return data.filter((user) => {
      const nameMatch = user.mName?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      const typeDisplay = user.type !== 'free' ? 'paid' : 'free';
      const typeMatch = typeDisplay.includes(query);
      return nameMatch || emailMatch || typeMatch;
    });
  }, [data, searchQuery]);

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/getusers`;
      const response = await axios.get(postURL);
      setData(response.data);
      setIsLoading(false);
    }
    dashboardData();
  }, []);

  // Handle user selection for bulk operations
  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredData.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredData.map(user => user._id));
    }
  };

  // Handle user editing
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  // Handle user deletion
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Save user changes
  const saveUserChanges = async () => {
    if (!editingUser) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/updateuser', {
        userId: editingUser._id,
        updates: editingUser
      });
      
      if (response.data.success) {
        setData(prev => prev.map(user => 
          user._id === editingUser._id ? editingUser : user
        ));
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/deleteuser', {
        userId: userToDelete._id
      });
      
      if (response.data.success) {
        setData(prev => prev.filter(user => user._id !== userToDelete._id));
        setSelectedUsers(prev => prev.filter(id => id !== userToDelete._id));
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk delete users
  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/bulkdeleteusers', {
        userIds: selectedUsers
      });
      
      if (response.data.success) {
        setData(prev => prev.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
        toast({
          title: "Success",
          description: `${selectedUsers.length} users deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk change user type
  const bulkChangeUserType = async (newType: string) => {
    if (selectedUsers.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await axios.post(serverURL + '/api/bulkupdateusers', {
        userIds: selectedUsers,
        updates: { type: newType }
      });
      
      if (response.data.success) {
        setData(prev => prev.map(user => 
          selectedUsers.includes(user._id) ? { ...user, type: newType } : user
        ));
        setSelectedUsers([]);
        toast({
          title: "Success",
          description: `${selectedUsers.length} users updated successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update users",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage your user accounts</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => bulkChangeUserType('free')}
                disabled={isProcessing}
              >
                <User className="mr-2 h-4 w-4" />
                Make Free
              </Button>
              <Button
                variant="outline"
                onClick={() => bulkChangeUserType('Monthly Plan')}
                disabled={isProcessing}
              >
                <Shield className="mr-2 h-4 w-4" />
                Make Monthly
              </Button>
              <Button
                variant="outline"
                onClick={() => bulkChangeUserType('Yearly Plan')}
                disabled={isProcessing}
              >
                <Shield className="mr-2 h-4 w-4" />
                Make Yearly
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedUsers.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Multiple Users</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedUsers.length} users? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={bulkDeleteUsers}>
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Users ({filteredData.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                    {selectedUsers.length === filteredData.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
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
                      <Skeleton className="h-5 w-24" />
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
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                {filteredData.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserSelection(user._id)}
                        className="h-6 w-6 p-0"
                      >
                        {selectedUsers.includes(user._id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{user.mName || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.type !== 'free' ? 'default' : 'secondary'}>
                        {user.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>No users match your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to user information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingUser.mName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, mName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Plan Type
                </Label>
                <Select
                  value={editingUser.type}
                  onValueChange={(value) => setEditingUser({ ...editingUser, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Plan</SelectItem>
                    <SelectItem value="Monthly Plan">Monthly Plan</SelectItem>
                    <SelectItem value="Yearly Plan">Yearly Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={editingUser.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, isActive: value === 'active' })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveUserChanges} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.mName || userToDelete?.email}? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
