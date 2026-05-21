import Job from '../../models/Job.js'

const updateJob = async (req, res) => {
    try {
        const jobId = req.params.id || req.body.jobId;
        const updateData = { ...req.body };
        // Remove jobId from updateData to prevent trying to overwrite it with undefined if not passed in body
        delete updateData.jobId;

        const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, { new: true });

        res.status(200).json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export { updateJob };