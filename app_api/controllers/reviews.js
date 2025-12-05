const mongoose = require("mongoose");
const Loc = mongoose.model("Location");
const User = mongoose.model("User");

// ------------------------------
// 1. Author 가져오기 (async/await)
// ------------------------------
const getAuthor = async (req) => {
  if (!req.auth || !req.auth.email) {
    throw { status: 401, message: "Unauthorized: No email provided" };
  }

  const user = await User.findOne({ email: req.auth.email }).exec();
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return user.name;
};

// ------------------------------
// 2. REVIEW CREATE
// ------------------------------
const reviewsCreate = async (req, res) => {
  try {
    const userName = await getAuthor(req);
    const locationId = req.params.locationid;

    if (!locationId) {
      return res.status(404).json({ message: "Location ID required" });
    }

    const location = await Loc.findById(locationId).select("reviews").exec();

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    await doAddReview(req, res, location, userName);
  } catch (err) {
    return res.status(err.status || 400).json(err);
  }
};

// ------------------------------
// 3. READ ONE REVIEW
// ------------------------------
const reviewsReadOne = async (req, res) => {
  try {
    const location = await Loc.findById(req.params.locationid)
      .select("name reviews")
      .exec();

    if (!location) {
      return res.status(404).json({ message: "location not found" });
    }

    if (!location.reviews || location.reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    const review = location.reviews.id(req.params.reviewid);
    if (!review) {
      return res.status(404).json({ message: "review not found" });
    }

    return res.status(200).json({
      location: {
        name: location.name,
        id: req.params.locationid,
      },
      review,
    });
  } catch (err) {
    return res.status(400).json(err);
  }
};

// ------------------------------
// 4. ADD REVIEW
// ------------------------------
const doAddReview = async (req, res, location, author) => {
  const { rating, reviewText } = req.body;

  location.reviews.push({ author, rating, reviewText });

  try {
    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);

    const thisReview = updatedLocation.reviews.slice(-1).pop();
    return res.status(201).json(thisReview);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// ------------------------------
// 5. SET AVG RATING
// ------------------------------
const doSetAverageRating = async (location) => {
  const count = location.reviews.length;
  const total = location.reviews.reduce((acc, r) => acc + r.rating, 0);

  location.rating = parseInt(total / count, 10);

  try {
    await location.save();
    console.log(`Updated average rating to ${location.rating}`);
  } catch (err) {
    console.log(err);
  }
};

// ------------------------------
// 6. UPDATE AVG RATING
// ------------------------------
const updateAverageRating = async (locationId) => {
  try {
    const location = await Loc.findById(locationId)
      .select("rating reviews")
      .exec();

    if (location) await doSetAverageRating(location);
  } catch (err) {
    console.log(err);
  }
};

// ------------------------------
// 7. UPDATE REVIEW
// ------------------------------
const reviewsUpdateOne = async (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    return res.status(404).json({
      message: "locationid and reviewid are both required",
    });
  }

  try {
    const location = await Loc.findById(req.params.locationid)
      .select("reviews")
      .exec();

    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    const review = location.reviews.id(req.params.reviewid);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.author = req.body.author;
    review.rating = req.body.rating;
    review.reviewText = req.body.reviewText;

    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);

    return res.status(200).json(review);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// ------------------------------
// 8. DELETE REVIEW
// ------------------------------
const reviewsDeleteOne = async (req, res) => {
  const { locationid, reviewid } = req.params;

  try {
    const location = await Loc.findById(locationid).select("reviews").exec();
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    const review = location.reviews.id(reviewid);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.deleteOne();
    await location.save();
    await updateAverageRating(location._id);

    return res.status(204).json(null);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// EXPORT
module.exports = {
  reviewsCreate,
  reviewsReadOne,
  doAddReview,
  doSetAverageRating,
  updateAverageRating,
  reviewsUpdateOne,
  reviewsDeleteOne,
};
