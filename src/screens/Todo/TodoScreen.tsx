import { useEffect, useState } from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    Modal,
} from 'react-native'
import { Check, SquaresFour } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import type { User } from '../../database'
import { AddTodoTaskModal } from './components/AddTodoTaskModal'
import { AddTodoCategoryModal } from './components/AddTodoCategoryModal'
import { GoalsSection } from './components/GoalsSection'
import type { TodoTaskCategory } from './todoTask.types'
import { useTodoGoalsViewModel } from './useTodoGoalsViewModel'
import { useTodoCategoriesViewModel } from './useTodoCategoriesViewModel'
import { useTodoTasksViewModel } from './useTodoTasksViewModel'

type TodoScreenProps = {
    currentUser: User
    isAddTaskModalVisible: boolean
    onMenuPress?: () => void
    onCloseAddTaskModal: () => void
}

export const TodoScreen = ({
    currentUser,
    isAddTaskModalVisible,
    onMenuPress = () => undefined,
    onCloseAddTaskModal,
}: TodoScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const [category, setCategory] = useState<TodoTaskCategory | null>(null)
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] =
        useState(false)
    const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] =
        useState(false)
    const goalsViewModel = useTodoGoalsViewModel(currentUser.id)
    const tasksViewModel = useTodoTasksViewModel(currentUser.id)
    const categoriesViewModel = useTodoCategoriesViewModel(currentUser.id)
    const categoryTasks = tasksViewModel.tasks.filter(
        task => category !== null && task.category === category,
    )
    const completedCount = categoryTasks.filter(task => task.isComplete).length
    const progress = categoryTasks.length
        ? Math.round((completedCount / categoryTasks.length) * 100)
        : 0
    const tasksSubtitle = category
        ? `${categoryTasks.length - completedCount} left to do`
        : categoriesViewModel.isLoading
        ? 'Loading categories…'
        : 'Create a category to get started'
    const addTask = (title: string) => {
        if (!category)
            return Promise.reject(new Error('Choose a category first.'))
        return tasksViewModel.createTask(title, category)
    }
    const addCategory = async (name: string) => {
        await categoriesViewModel.createCategory(name)
        setCategory(name.trim())
    }

    useEffect(() => {
        if (!categoriesViewModel.isLoading && !category) {
            setCategory(categoriesViewModel.categories[0]?.name ?? null)
        }
    }, [
        categoriesViewModel.categories,
        categoriesViewModel.isLoading,
        category,
    ])

    useEffect(() => {
        if (
            !isAddTaskModalVisible ||
            categoriesViewModel.isLoading ||
            categoriesViewModel.categories.length > 0
        )
            return
        onCloseAddTaskModal()
        setIsAddCategoryModalVisible(true)
    }, [
        categoriesViewModel.categories.length,
        categoriesViewModel.isLoading,
        isAddTaskModalVisible,
        onCloseAddTaskModal,
    ])

    return (
        <ScreenLayout
            title="To-do"
            subtitle={<ScreenSubtitle>Organize your next steps</ScreenSubtitle>}
            userName={currentUser.name}
            level={currentUser.level}
            totalPoints={currentUser.totalPoints}
            onProfilePress={() => undefined}
            onMenuPress={onMenuPress}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingHorizontal: spacing.lg * scale },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    accessibilityLabel="Choose task category"
                    accessibilityRole="button"
                    onPress={() => setIsCategoryPickerVisible(true)}
                    style={styles.categoryButton}
                >
                    <SquaresFour
                        color={colors.text}
                        size={23}
                        weight="regular"
                    />
                </Pressable>

                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={styles.progressEyebrow}>PROGRESS</Text>
                            <Text style={styles.progressTitle}>
                                {category ?? 'No category selected'}
                            </Text>
                        </View>
                        <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View
                        accessibilityLabel={`${progress}% completed`}
                        accessibilityRole="progressbar"
                        style={styles.progressTrack}
                    >
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progress}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressCaption}>
                        {completedCount} of {categoryTasks.length} tasks
                        completed
                    </Text>
                </View>

                {tasksViewModel.loadError ? (
                    <Text style={styles.taskError}>
                        {tasksViewModel.loadError}
                    </Text>
                ) : null}

                <View style={styles.tasksHeader}>
                    <View>
                        <Text style={styles.tasksTitle}>Your tasks</Text>
                        <Text style={styles.tasksSubtitle}>
                            {tasksSubtitle}
                        </Text>
                    </View>
                </View>

                <View style={styles.taskList}>
                    {tasksViewModel.isLoading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Loading tasks…</Text>
                        </View>
                    ) : categoryTasks.length ? (
                        categoryTasks.map((task, index) => (
                            <Pressable
                                accessibilityRole="checkbox"
                                accessibilityState={{
                                    checked: task.isComplete,
                                }}
                                key={task.id}
                                onPress={() =>
                                    tasksViewModel.toggleTask(task.id)
                                }
                                style={[
                                    styles.taskRow,
                                    index < categoryTasks.length - 1 &&
                                        styles.taskRowBorder,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        task.isComplete &&
                                            styles.checkboxChecked,
                                    ]}
                                >
                                    {task.isComplete ? (
                                        <Check
                                            color={colors.white}
                                            size={15}
                                            weight="bold"
                                        />
                                    ) : null}
                                </View>
                                <Text
                                    style={[
                                        styles.taskText,
                                        task.isComplete &&
                                            styles.taskTextComplete,
                                    ]}
                                >
                                    {task.title}
                                </Text>
                            </Pressable>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>
                                {category
                                    ? 'No tasks yet'
                                    : categoriesViewModel.isLoading
                                    ? 'Loading categories…'
                                    : 'No category yet'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {category
                                    ? 'Add your first task to get started.'
                                    : 'Create a category to organize your tasks.'}
                            </Text>
                        </View>
                    )}
                </View>
                <GoalsSection
                    goals={goalsViewModel.goalCards}
                    habitOptions={goalsViewModel.habitOptions}
                    onCreateGoal={goalsViewModel.createGoal}
                    onDeleteGoal={goalsViewModel.deleteGoal}
                />
            </ScrollView>
            <AddTodoTaskModal
                category={category ?? ''}
                isVisible={isAddTaskModalVisible}
                onClose={onCloseAddTaskModal}
                onCreateTask={addTask}
            />
            <Modal
                animationType="fade"
                onRequestClose={() => setIsCategoryPickerVisible(false)}
                transparent
                visible={isCategoryPickerVisible}
            >
                <View style={styles.categoryModalOverlay}>
                    <Pressable
                        accessibilityLabel="Close category picker"
                        onPress={() => setIsCategoryPickerVisible(false)}
                        style={styles.categoryModalBackdrop}
                    />
                    <View style={styles.categoryModal}>
                        <Text style={styles.categoryModalTitle}>
                            Choose a category
                        </Text>
                        {categoriesViewModel.categories.map(item => {
                            const count = tasksViewModel.tasks.filter(
                                task => task.category === item.name,
                            ).length
                            const isSelected = category === item.name

                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={item.id}
                                    onPress={() => {
                                        setCategory(item.name)
                                        setIsCategoryPickerVisible(false)
                                    }}
                                    style={[
                                        styles.categoryOption,
                                        isSelected &&
                                            styles.categoryOptionSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            isSelected &&
                                                styles.categoryOptionTextSelected,
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text style={styles.categoryOptionCount}>
                                        {count} tasks
                                    </Text>
                                </Pressable>
                            )
                        })}
                        {categoriesViewModel.categories.length === 0 ? (
                            <Text style={styles.categoryEmptyText}>
                                {categoriesViewModel.isLoading
                                    ? 'Loading categories…'
                                    : 'No categories yet. Create one to organize your tasks.'}
                            </Text>
                        ) : null}
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                                setIsCategoryPickerVisible(false)
                                setIsAddCategoryModalVisible(true)
                            }}
                            style={styles.addCategoryButton}
                        >
                            <Text style={styles.addCategoryText}>
                                + Add category
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <AddTodoCategoryModal
                isVisible={isAddCategoryModalVisible}
                onClose={() => setIsAddCategoryModalVisible(false)}
                onCreateCategory={addCategory}
            />
        </ScreenLayout>
    )
}

const styles = StyleSheet.create({
    content: { paddingBottom: spacing.xl, paddingTop: spacing.lg },
    categoryButton: {
        alignItems: 'center',
        borderColor: colors.border,
        borderRadius: 14,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        marginBottom: spacing.lg,
        width: 48,
    },
    categoryModalOverlay: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    categoryModalBackdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    categoryModal: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        padding: spacing.md,
        width: '82%',
    },
    categoryModalTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    categoryOption: {
        alignItems: 'center',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },
    categoryOptionSelected: { backgroundColor: colors.scheduleCurrent },
    categoryOptionText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
    },
    categoryOptionTextSelected: { color: colors.text },
    categoryOptionCount: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
    addCategoryButton: {
        borderTopColor: colors.border,
        borderTopWidth: 1,
        marginTop: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    addCategoryText: {
        color: colors.scheduleBackground,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    categoryEmptyText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 19,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    progressCard: {
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: spacing.xl,
        padding: spacing.md,
    },
    progressHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    progressEyebrow: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    progressTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '600',
        marginTop: 3,
    },
    progressPercent: {
        color: colors.scheduleBackground,
        fontFamily: typography.fontFamily,
        fontSize: 25,
        fontWeight: '700',
    },
    progressTrack: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 4,
        height: 7,
        overflow: 'hidden',
    },
    progressFill: {
        backgroundColor: colors.scheduleBackground,
        borderRadius: 4,
        height: '100%',
    },
    progressCaption: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    tasksHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    tasksTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '600',
    },
    tasksSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 2,
    },
    taskError: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginBottom: spacing.md,
    },
    taskList: {
        marginTop: spacing.sm,
    },
    taskRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 66,
        paddingVertical: spacing.sm,
    },
    taskRowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
    checkbox: {
        alignItems: 'center',
        borderColor: colors.textMuted,
        borderRadius: 6,
        borderWidth: 1.5,
        height: 23,
        justifyContent: 'center',
        width: 23,
    },
    checkboxChecked: {
        backgroundColor: colors.scheduleBackground,
        borderColor: colors.scheduleBackground,
    },
    taskText: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        lineHeight: 20,
    },
    taskTextComplete: {
        color: colors.textMuted,
        textDecorationLine: 'line-through',
    },
    emptyState: { alignItems: 'center', padding: spacing.xl },
    emptyTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
})
